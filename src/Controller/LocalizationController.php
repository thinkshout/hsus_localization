<?php

namespace Drupal\hsus_localization\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\smart_ip\SmartIp;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 * Class LocalizationController. Adds Localization.
 */
class LocalizationController extends ControllerBase {

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManager
   */
  protected $entityTypeManager;

  /**
   * The block content storage.
   *
   * @var \Drupal\block_content\BlockContentStorageInterface
   */
  protected $blockContentStorage;

  /**
   * The renderer.
   *
   * @var \Drupal\Core\Render\Renderer
   */
  protected $renderer;

  /**
   * {@inheritDoc}
   */
  public static function create(ContainerInterface $container) {
    $instance = parent::create($container);
    $instance->entityTypeManager = $container->get('entity_type.manager');
    $instance->blockContentStorage = $container->get('entity_type.manager')->getStorage('block_content');
    $instance->renderer = $container->get('renderer');
    return $instance;
  }

  /**
   * Displays a custom block.
   *
   * @return array
   *   A render array representing the block.
   */
  public function displayBlock($id) {
    // Load the custom block by ID.
    $block = $this->blockContentStorage->load($id);
    if ($block) {
      $block_content = $this->entityTypeManager
        ->getViewBuilder('block_content')
        ->view($block, 'default');
      // @todo Fix problem: update to render $block_content. See PR #2031.
      $rendered_block = $this->renderer->renderRoot($block_content);
      return new Response($rendered_block);
    }
    else {
      return [
        '#markup' => $this->t('Block not found or invalid type.'),
      ];
    }
  }

  /**
   * Check for localized versions of a block.
   *
   * @param int $ip
   *   The block ID to search for.
   *
   * @return array
   *   An array of paragraph labels.
   */
  public function lookupIp($ip) {
    // Get Location Object from SmartIP.
    $location_data = SmartIp::query($ip);
    $state_code = $location_data['regionCode'];

    return new JsonResponse([
      'ip' => $ip,
      'state_code' => $state_code,
    ]);
  }

}
